import { API } from "./api.ts";
import { get_sync } from "./sync.ts";

const api = await API.setup();

for (const zone of await api.get_zones()) {
  console.log(`[${zone.zone}] starting`);

  const remote = await api.get_records(zone);
  const sync = get_sync(remote, zone);

  console.log(`${sync.invalid} invalid records found`);
  console.log(`${sync.total} changes to make`);

  await api.sync_records(zone, sync);

  console.log(`[${zone.zone}] finished`);
}

export type RecordType = {
  id?: string;
  type: string;
  label: string;
  value: string;
};

export type ZoneType = {
  /** the zone id */
  id: string;
  /** the domain */
  zone: string;
};
