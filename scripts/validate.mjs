import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function readManufacturers() {
  const filepath = path.join("./manufacturers", "manufacturers.json");
  const manufacturers = JSON.parse(await readFile(filepath, "utf-8"));
  const manufacturerSet = new Set();

  //validate that no id is used more than once
  for (const m of manufacturers) {
    if (manufacturerSet.has(m.id)) {
      throw new Error(`Duplicate manufacturer id ${m.id}`);
    } else {
      manufacturerSet.add(m.id);
    }
  }

  return manufacturerSet;
}

async function readSignaltypes() {
  const filepath = path.join("./signaltypes", "signaltypes.json");
  const signaltypes = JSON.parse(await readFile(filepath, "utf-8"));
  const signaltypeSet = new Set();

  //validate that no id is used more than once
  for (const s of signaltypes) {
    if (signaltypeSet.has(s.id)) {
      throw new Error(`Duplicate signaltype id ${s.id}`);
    } else {
      signaltypeSet.add(s.id);
    }
  }

  return signaltypeSet;
}

async function readModuleformfactors() {
  const filepath = path.join("./moduleformfactors", "moduleformfactors.json");
  const moduleformfactors = JSON.parse(await readFile(filepath, "utf-8"));
  const moduleformfactorSet = new Set();

  //validate that no id is used more than once
  for (const ff of moduleformfactors) {
    if (moduleformfactorSet.has(ff.id)) {
      throw new Error(`Duplicate moduleformfactor id ${ff.id}`);
    } else {
      moduleformfactorSet.add(ff.id);
    }
  }

  return moduleformfactorSet;
}

async function readConnectors() {
  const filepath = path.join("./connectors", "connectors.json");
  const connectors = JSON.parse(await readFile(filepath, "utf-8"));
  const connectorSet = new Set();

  //validate that no id is used more than once
  for (const c of connectors) {
    if (connectorSet.has(c.id)) {
      throw new Error(`Duplicate connector id ${c.id}`);
    } else {
      connectorSet.add(c.id);
    }
  }

  //validate compatible connectors only include valid ids
  for (const c of connectors) {
    for (const cc of c.compatibleConnectors) {
      if (!connectorSet.has(cc)) {
        throw new Error(
          `${c.id}: Compatible connector id ${cc} does not exist`,
        );
      }
    }
  }

  return connectorSet;
}

async function readModuletypes(manufacturers) {
  const folders = await readdir("./moduletypes");

  const moduletypeSet = new Set();

  for (const folder of folders) {
    //check foldername exists as manufacturer id
    if (!manufacturers.has(folder)) {
      throw new Error(`Manufacturer ${folder} does not exist`);
    }

    const files = await readdir(path.join("./moduletypes", folder));
    for (const file of files) {
      const moduletype = JSON.parse(
        await readFile(path.join("./moduletypes", folder, file), "utf-8"),
      );

      //check filename and moduletypeId match
      if (file.slice(0, -5) !== moduletype.id) {
        throw new Error(`${file}: moduleTypeId and file name do not match`);
      }

      const manufacturer = moduletype.manufacturerId;
      //check manufacturerId exists
      if (!manufacturers.has(manufacturer)) {
        throw new Error(
          `${moduletype.id}: Manufacturer ${manufacturer} does not exist`,
        );
      }

      //check manufacturerId matches foldername
      if (manufacturer !== folder) {
        throw new Error(
          `${moduletype.id}: Moduletype from manufacturer ${manufacturer} in folder ${folder}`,
        );
      }

      //check moduletype.id starts with manufacturerId
      if (!moduletype.id.startsWith(manufacturer)) {
        throw new Error(
          `${moduletype.id}: Moduletype ${moduletype.id} does not start with ${manufacturer}`,
        );
      }
      moduletypeSet.add(moduletype.id);
    }
  }
  return moduletypeSet;
}

async function validateModuletypes(
  connectors,
  signaltypes,
  moduleformfactors,
  moduletypes,
) {
  const folders = await readdir("./moduletypes");

  for (const folder of folders) {
    const files = await readdir(path.join("./moduletypes", folder));

    for (const file of files) {
      const moduletype = JSON.parse(
        await readFile(path.join("./moduletypes", folder, file)),
      );

      //check moduleFormFactorId
      const moduleFormFactorId = moduletype.moduleFormFactorId;
      if (
        moduleFormFactorId !== null &&
        !moduleformfactors.has(moduleFormFactorId)
      ) {
        throw new Error(
          `${file}: Form factor ${moduleFormFactorId} does not exist`,
        );
      }

      //check portTypes
      const portTypes = moduletype.portTypes;

      if (Array.isArray(portTypes)) {
        for (const p of portTypes) {
          //check connectorId is valid
          if (!connectors.has(p.connectorId)) {
            throw new Error(
              `${file}: Connector ${p.connectorId} at ${p.name} does not exist`,
            );
          }

          //check compatibleSignalTypes are valid
          const compatibleSignalTypes = p.compatibleSignalTypes;
          for (const cst of compatibleSignalTypes) {
            if (!signaltypes.has(cst)) {
              throw new Error(
                `${file}: Signaltype ${cst} at ${p.name} does not exist`,
              );
            }
          }
        }
      }
      //check moduleSlots
      const moduleSlotTypes = moduletype.moduleSlotTypes;

      if (Array.isArray(moduleSlotTypes)) {
        for (const mst of moduleSlotTypes) {
          //check form factors are valid
          for (const cff of mst.compatibleModuleSlotFormFactors) {
            if (!moduleformfactors.has(cff)) {
              throw new Error(
                `${file}: Form factor ${cff} at ${mst.name} does not exist`,
              );
            }
          }
          //check compatibleModuleTypes are valid
          for (const cmt of mst.compatibleModuleTypes) {
            if (!moduletypes.has(cmt)) {
              throw new Error(
                `${file}: Compatible module type ${cmt} at ${mst.name} does not exist`,
              );
            }
          }
          //check incompatibleModuleTypes are valid
          for (const imt of mst.incompatibleModuleTypes) {
            if (!moduletypes.has(imt)) {
              throw new Error(
                `${file}: Incompatible module type ${imt} at ${mst.name} does not exist`,
              );
            }
          }
        }
      }
    }
  }
}

async function validateDevictypes(
  manufacturers,
  connectors,
  signaltypes,
  moduleformfactors,
  moduletypes,
) {
  const folders = await readdir("./devicetypes");

  for (const folder of folders) {
    const files = await readdir(path.join("./devicetypes", folder));

    for (const file of files) {
      const dt = JSON.parse(
        await readFile(path.join("./devicetypes", folder, file)),
      );

      //check filename and devicetypeid match
      if (dt.id !== file.slice(0, -5)) {
        throw new Error(`${file}: File name and deviceTypeId do not match`);
      }

      //check manufacturer exists
      if (!manufacturers.has(dt.manufacturerId)) {
        throw new Error(
          `${file}: Manufacturer ${dt.manufacturerId} does not exist`,
        );
      }

      //check manufacturer and folder match
      if (dt.manufacturerId !== folder) {
        throw new Error(
          `${file}: Devicetype with manufacturer ${dt.manufacturerId} in folder ${folder}`,
        );
      }

      //check manufacturer included in id
      if (!dt.id.startsWith(dt.manufacturerId)) {
        throw new Error(
          `${file}: ${dt.id} does not start with ${dt.manufacturerId}`,
        );
      }

      //check portTypes
      const portTypes = dt.portTypes;

      if (Array.isArray(portTypes)) {
        for (const p of portTypes) {
          //check connectorId is valid
          if (!connectors.has(p.connectorId)) {
            throw new Error(
              `${file}: Connector ${p.connectorId} at ${p.name} does not exist`,
            );
          }

          //check compatibleSignalTypes are valid
          const compatibleSignalTypes = p.compatibleSignalTypes;
          for (const cst of compatibleSignalTypes) {
            if (!signaltypes.has(cst)) {
              throw new Error(
                `${file}: Signaltype ${cst} at ${p.name} does not exist`,
              );
            }
          }
        }
      }

      //check moduleSlotTypes
      const moduleSlotTypes = dt.moduleSlotTypes;

      if (Array.isArray(moduleSlotTypes)) {
        for (const mst of moduleSlotTypes) {
          //check form factors are valid
          for (const cff of mst.compatibleModuleSlotFormFactors) {
            if (!moduleformfactors.has(cff)) {
              throw new Error(
                `${file}: Form factor ${cff} at ${mst.name} does not exist`,
              );
            }
          }
          //check compatibleModuleTypes are valid
          for (const cmt of mst.compatibleModuleTypes) {
            if (!moduletypes.has(cmt)) {
              throw new Error(
                `${file}: Compatible module type ${cmt} at ${mst.name} does not exist`,
              );
            }
          }
          //check incompatibleModuleTypes are valid
          for (const imt of mst.incompatibleModuleTypes) {
            if (!moduletypes.has(imt)) {
              throw new Error(
                `${file}: Incompatible module type ${imt} at ${mst.name} does not exist`,
              );
            }
          }
        }
      }
    }
  }
}

async function main() {
  try {
    //reading from the files
    //inculdes checks to ensure no duplicate ids
    const manufacturers = await readManufacturers();
    const signaltypes = await readSignaltypes();
    const moduleformfactors = await readModuleformfactors();

    //this also checks compatibleConnectors is valid
    const connectors = await readConnectors();

    //read all moduletype ids
    const moduletypes = await readModuletypes(manufacturers);

    //validate manufacturers, connectors, signaltypes, formfactors of moduletypes
    await validateModuletypes(
      connectors,
      signaltypes,
      moduleformfactors,
      moduletypes,
    );
    //validate manufacturers, connectors, signaltypes, formfactors, compatible moduletypes of devicetypes
    await validateDevictypes(
      manufacturers,
      connectors,
      signaltypes,
      moduleformfactors,
      moduletypes,
    );
    console.log("Validation successful");
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
}

main();
