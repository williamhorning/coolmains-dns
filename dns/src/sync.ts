import { existsSync } from "./deps.ts";
import { RecordType, ZoneType } from "./main.ts";

/**
 * SyncType is the object telling API#sync_records what to do
 */
export type SyncType = {
  /** post contains the new/updated records from our side */
  post: RecordType[];
  /** del contains the new/updated records from their side */
  del: RecordType[];
  /** invalid contains the number of invalid records on our side */
  invalid: number;
  /** total contains the total number of changes to make */
  total: number;
};

/**
 * get_sync compares the local and remote records to determine what needs to be
 * done to sync them
 */
export function get_sync(remote: RecordType[], zone: ZoneType): SyncType {
  const { local, invalid } = get_local(zone);
  const post = get_diff(local, remote);
  const del = get_diff(remote, local);
  const total = post.length + del.length;

  return { post, del, invalid, total };
}

/**
 * get_diff compares two arrays of RecordType objects and returns the difference
 */
function get_diff(r1: RecordType[], r2: RecordType[]) {
  return r1.filter(
    (x) =>
      !r2.find(
        (y) => y.label === x.label && y.type === x.type && y.value === x.value
      )
  );
}

/**
 * get_local reads the local zone file and returns the records
 */
function get_local(zone: ZoneType) {
  const local = [] as RecordType[];
  let invalid = 0;

  if (
    !existsSync(`./zones/${zone.zone}`, { isDirectory: true, isReadable: true })
  ) {
    throw new Error(`Zone folder does not exist: ${zone.zone}`);
  }

  for (const file of Deno.readDirSync(`./zones/${zone.zone}`)) {
    if (!file.isFile || !file.name.endsWith(".json")) continue;

    const append = file.name === "@.json" ? "" : file.name.split(".")[0];

    const records = JSON.parse(
      Deno.readTextFileSync(`./zones/${zone.zone}/${file.name}`)
    );

    for (const record of records) {
      if (isInvalid(record)) {
        invalid++;
        continue;
      }
      if (append && record.label !== "@") {
        record.label = `${record.label}.${append}`;
      } else if (append && record.label === "@") {
        record.label = append;
      }

      local.push(record);
    }
  }

  return { invalid, local };
}

/**
 * isInvalid checks if a record is invalid
 */
function isInvalid(record: RecordType) {
  return (
    !record.label ||
    !record.type ||
    !record.value ||
    typeof record.type !== "string" ||
    typeof record.label !== "string" ||
    typeof record.value !== "string"
  );
}
