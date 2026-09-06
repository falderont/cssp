"use client";

import { useMemo, useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createFacility } from "@/actions/admin";

type City = { id: string; name: string };
type Country = { id: string; name: string; code: string; cities: City[] };
type Region = { id: string; name: string; code: string; countries: Country[] };

// Site onboarding is contract-driven: a Global Sys Admin (or delegated
// Service Desk) creates the site once a contract is signed, adding the
// country and city it's located in right here when they're new — instead of
// requiring a separate trip to the standalone Countries/Cities pages first.
export function FacilityForm({ regions }: { regions: Region[] }) {
  const [regionId, setRegionId] = useState(regions[0]?.id ?? "");
  const [countryMode, setCountryMode] = useState<"existing" | "new">("existing");
  const [countryId, setCountryId] = useState("");
  const [cityMode, setCityMode] = useState<"existing" | "new">("existing");
  const [cityId, setCityId] = useState("");

  const region = regions.find((r) => r.id === regionId);
  const countries = region?.countries ?? [];
  const country = countries.find((c) => c.id === countryId);
  const cities = country?.cities ?? [];

  function onRegionChange(id: string) {
    setRegionId(id);
    setCountryMode("existing");
    setCountryId("");
    setCityMode("existing");
    setCityId("");
  }

  function onCountryModeChange(mode: "existing" | "new") {
    setCountryMode(mode);
    setCountryId("");
    // A brand-new country has no cities yet — the city must be new too.
    setCityMode(mode === "new" ? "new" : "existing");
    setCityId("");
  }

  function onCountryChange(id: string) {
    setCountryId(id);
    setCityMode("existing");
    setCityId("");
  }

  const cityCountryId = useMemo(() => (countryMode === "existing" ? countryId : ""), [countryMode, countryId]);

  return (
    <form action={createFacility} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-4">
        <p className="text-sm font-medium text-slate-700">Location — where is this site?</p>

        <Field label="Region" htmlFor="regionId" required>
          <Select id="regionId" name="regionId" required value={regionId} onChange={(e) => onRegionChange(e.target.value)}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Country" htmlFor="countryMode" required hint="Onboarding a site in a country you haven't opened yet? Add it here.">
          <Select id="countryMode" name="countryMode" value={countryMode} onChange={(e) => onCountryModeChange(e.target.value as "existing" | "new")}>
            <option value="existing" disabled={countries.length === 0}>
              Existing country
            </option>
            <option value="new">+ New country</option>
          </Select>
        </Field>

        {countryMode === "existing" ? (
          <Field label="Which country" htmlFor="countryId" required>
            <Select id="countryId" name="countryId" required value={countryId} onChange={(e) => onCountryChange(e.target.value)}>
              <option value="" disabled>
                {countries.length === 0 ? "No countries yet in this region" : "Choose…"}
              </option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="New country name" htmlFor="newCountryName" required>
              <Input id="newCountryName" name="newCountryName" required placeholder="e.g. Indonesia" />
            </Field>
            <Field label="Country code" htmlFor="newCountryCode" required hint="ISO 3166-1 alpha-2, e.g. ID">
              <Input id="newCountryCode" name="newCountryCode" required maxLength={2} placeholder="ID" />
            </Field>
          </div>
        )}

        <Field
          label="City"
          htmlFor="cityMode"
          required
          hint={countryMode === "new" ? "A brand-new country has no cities yet." : "First site in this city? Add it here."}
        >
          <Select id="cityMode" name="cityMode" value={cityMode} onChange={(e) => setCityMode(e.target.value as "existing" | "new")}>
            {countryMode === "existing" && (
              <option value="existing" disabled={cities.length === 0}>
                Existing city
              </option>
            )}
            <option value="new">+ New city</option>
          </Select>
        </Field>

        {cityMode === "existing" ? (
          <Field label="Which city" htmlFor="cityId" required>
            <Select id="cityId" name="cityId" required value={cityId} onChange={(e) => setCityId(e.target.value)}>
              <option value="" disabled>
                {cityCountryId ? (cities.length === 0 ? "No cities yet in this country" : "Choose…") : "Choose a country first"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="New city name" htmlFor="newCityName" required>
            <Input id="newCityName" name="newCityName" required placeholder="e.g. Batam" />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required>
          <Input id="name" name="name" required placeholder="e.g. NDP — Batam" />
        </Field>
        <Field label="Code" htmlFor="code" required>
          <Input id="code" name="code" required placeholder="NDP" />
        </Field>
        <Field label="Timezone" htmlFor="timezone" required>
          <Input id="timezone" name="timezone" required defaultValue="Asia/Jakarta" />
        </Field>
      </div>
      <Field label="Address" htmlFor="address">
        <Input id="address" name="address" placeholder="Street address" />
      </Field>
      <Field label="Campus access control (ACS) endpoint" htmlFor="acsEndpointUrl" hint="Optional — leave blank to use the built-in mock adapter">
        <Input id="acsEndpointUrl" name="acsEndpointUrl" placeholder="https://acs.example.com/api/badges" />
      </Field>
      <Button type="submit">Add facility</Button>
    </form>
  );
}
