import { Document, RulesetDefinition, Spectral } from "@stoplight/spectral-core";
import { oas2, oas3 } from "@stoplight/spectral-formats";

import { DiagnosticSeverity } from "@stoplight/types";
import { Json } from "@stoplight/spectral-parsers";
import { join } from "path";
import { readFileSync } from "fs";
import { truthy } from "@stoplight/spectral-functions";

const source = join(__dirname, "valid.json")
const document = new Document(readFileSync(source, {encoding: "utf-8"}), Json, source)

const ruleset: RulesetDefinition = {
aliases: {
    odataV4: ['$.[?(@property === "x-sap-api-type" && @ === "ODATAV4")]'],
    odataV2: ['$.[?(@property === "x-sap-api-type" && @ === "ODATA")]'],
    odataV2All: ["#odataV2^.paths.*.*.responses[?(@property.match(/^[12]/))]"],
    odataV4All: ["#odataV4^.paths.*.*.responses[?(@property.match(/^[12]/))]"],
    odataAll: [
      "#odataV4All.content.application/json.schema.properties.value.items",
      "#odataV4All.schema.properties.value.items",
      "#odataV2All.content.application/json.schema.properties.d.properties.results.items",
      "#odataV2All.schema.properties.d.properties.results.items",
      '#odataV4All.content.application/json[?(@.type == "object" && @.properties && !@.properties.value)]',
      "#odataV4All[?(@.properties && !@.properties.value)]",
      '#odataV2All.content.application/json.schema.properties[?(@.type === "object" && @.properties && !@.properties.results)]',
      '#odataV2All.schema.properties[?(@.type === "object" && @.properties && !@.properties.results)]',
    ],
    restPrefix: [
      '$[?(@root["x-sap-api-type"] === undefined && @property === "paths")]',
      '$[?(@property === "x-sap-api-type" && @ === "REST")]',
    ],
    restAll: [
      '#restPrefix^.paths.*.*.responses[?(@property.match(/^[12]/))].content.application/json[?(@.type == "object")]',
      '#restPrefix^.paths.*.*.responses[?(@property.match(/^[12]/))][?(@.type == "object")]',
    ],
  },
  formats: [oas2, oas3],
  rules: {
    "odata-place-holder": {
      message: "Field `x-custom-extension` missing.",
      severity: DiagnosticSeverity.Error,
      given: ["#restAll", "#odataAll"],
      then: {
        field: "x-custom-extension",
        function: truthy
      }
    }
  }
}

const spectral = new Spectral()
spectral.setRuleset(ruleset)

spectral.run(document).then(console.log);