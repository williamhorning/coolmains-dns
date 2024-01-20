import { existsSync, parse, promptSecret } from "./deps.ts";
import { RecordType, ZoneType } from "./main.ts";
import { SyncType } from "./sync.ts";

export type ConfigType = {
  token?: string;
};

export class API {
  config: ConfigType = {};

  constructor(_tokenrequired: boolean = true) {
    if (existsSync("config.toml")) {
      try {
        this.config = parse(Deno.readTextFileSync("config.toml"));
      } catch (e) {
        throw new Error("Failed to parse config.toml", { cause: e });
      }
    }

    if (Deno.env.has("PACKETFRAME_TOKEN")) {
      this.config.token = Deno.env.get("PACKETFRAME_TOKEN");
    }

    if (!this.config?.token && _tokenrequired) {
      throw new Error("No token found, try running `pf login`");
    }
  }

  static async setup() {
    let api;
    try {
      api = new API();
    } catch {
      api = await API.login({
        email: prompt("Email: ") as string,
        password: promptSecret("Password: ") as string,
      });
    }
    return api;
  }

  static async login({ email, password }: { email: string; password: string }) {
    const api = new API(true);

    const login_resp = await api.fetch("user/login", "POST", {
      email,
      password,
    });

    const token = login_resp.headers
      .getSetCookie()[0]
      .split(";")[0]
      .split("=")[1];

    await Deno.writeTextFile("config.toml", `token="${token}"`);

    return api;
  }

  async fetch<T>(path: string, method: string, body?: Record<string, unknown>) {
    const resp = await fetch("https://packetframe.com/api/" + path, {
      method,
      headers: {
        Authorization: `Token ${this.config.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await resp.json();

    if (!json.success) {
      throw new Error(`Failed to fetch ${path}`, { cause: json });
    }

    return {
      ...resp,
      json: json.data as T,
    };
  }

  async get_records(zone: ZoneType) {
    return (
      await this.fetch<{ records: RecordType[] }>(
        `dns/records/${zone.id}`,
        "GET"
      )
    ).json.records;
  }

  async get_zones() {
    return (await this.fetch<{ zones: ZoneType[] }>("dns/zones", "GET")).json
      .zones;
  }

  async sync_records(zone: ZoneType, sync: SyncType) {
    for (const record of sync.del) {
      await this.#update_record("DELETE", zone, record);
    }
    for (const record of sync.post) {
      await this.#update_record("POST", zone, record);
    }
  }

  async #update_record(
    action: "POST" | "DELETE",
    zone: ZoneType,
    record: RecordType
  ) {
    await this.fetch(`dns/records`, action, {
      zone: zone.id,
      record: record.id,
      type: record.type,
      label: record.label,
      value: record.value,
      ttl: 86400,
    });
  }
}
