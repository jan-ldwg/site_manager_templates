import { readFile } from "node:fs/promises";

async function readManufacturers() {
  const filepath = path.join("./manufacturers", "manufacturers.json");
  const manufacturers = JSON.parse(await readFile(filepath, "utf-8"));
  const manufacturersSet = new Set();

  //validate that no id is used more than once
  for (const m of manufacturers) {
    if (manufacturersSet.has(m.id)) {
      throw new Error(`Duplicate manufacturer id ${m.id}`);
    } else {
      manufacturersSet.add(m.id);
    }
  }

  return manufacturersSet;
}

async function readSignaltypes() {}

async function readConnectors() {}

async function main() {
  const manufacturers = await readManufacturers();
}

main();
