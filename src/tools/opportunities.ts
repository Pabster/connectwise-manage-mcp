import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CwManageClient } from "../api-client.js";

export function registerOpportunityTools(server: McpServer, client: CwManageClient) {
  server.tool(
    "cw_search_opportunities",
    "Search sales opportunities in ConnectWise Manage. Use 'conditions' for CW query syntax (e.g. \"status/name = '1. Open'\", \"closedFlag = false\").",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'id desc')"),
    },
    async ({ conditions, page, pageSize, orderBy }) => {
      const result = await client.get("/sales/opportunities", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
        orderBy,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_get_opportunity",
    "Get a specific sales opportunity by ID.",
    {
      id: z.number().describe("Opportunity ID"),
    },
    async ({ id }) => {
      const result = await client.get(`/sales/opportunities/${id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_search_opportunity_forecasts",
    "Search opportunity forecasts/revenue items for a specific opportunity.",
    {
      opportunityId: z.number().describe("Opportunity ID"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ opportunityId, page, pageSize }) => {
      const result = await client.get(`/sales/opportunities/${opportunityId}/forecast`, {
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_search_opportunity_notes",
    "Get notes on a specific sales opportunity.",
    {
      opportunityId: z.number().describe("Opportunity ID"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ opportunityId, page, pageSize }) => {
      const result = await client.get(`/sales/opportunities/${opportunityId}/notes`, {
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_search_sales_stages",
    "List sales pipeline stages in ConnectWise Manage.",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/sales/stages", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_create_opportunity",
    "Create a new sales opportunity in ConnectWise Manage.",
    {
      name: z.string().describe("Opportunity name/title"),
      companyId: z.number().describe("Company ID"),
      contactId: z.number().optional().describe("Contact ID"),
      stageId: z.number().optional().describe("Pipeline stage ID (use cw_search_sales_stages to discover)"),
      statusId: z.number().optional().describe("Opportunity status ID"),
      expectedCloseDate: z.string().optional().describe("Expected close date (ISO 8601)"),
      probability: z.number().optional().describe("Win probability percentage (0-100)"),
      notes: z.string().optional().describe("Opportunity notes"),
      assignedToId: z.number().optional().describe("Assigned member ID"),
    },
    async ({ name, companyId, contactId, stageId, statusId, expectedCloseDate, probability, notes, assignedToId }) => {
      const body: Record<string, unknown> = {
        name,
        company: { id: companyId },
      };
      if (contactId) body.contact = { id: contactId };
      if (stageId) body.stage = { id: stageId };
      if (statusId) body.status = { id: statusId };
      if (expectedCloseDate) body.expectedCloseDate = expectedCloseDate;
      if (probability !== undefined) body.probability = { probability };
      if (notes) body.notes = notes;
      if (assignedToId) body.assignedTo = { id: assignedToId };
      const result = await client.post("/sales/opportunities", body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_update_opportunity",
    "Update an existing sales opportunity using JSON Patch operations.",
    {
      id: z.number().describe("Opportunity ID"),
      operations: z.array(z.object({
        op: z.enum(["replace", "add", "remove"]).describe("Patch operation"),
        path: z.string().describe("JSON path (e.g. 'stage/id', 'status/id', 'expectedCloseDate', 'notes')"),
        value: z.unknown().optional().describe("New value"),
      })).describe("Array of JSON Patch operations"),
    },
    async ({ id, operations }) => {
      const result = await client.patch(`/sales/opportunities/${id}`, operations);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_list_activity_types",
    "List activity types in ConnectWise Manage (used when creating activities to discover valid typeId values).",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/sales/activities/types", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_list_activity_statuses",
    "List activity statuses in ConnectWise Manage (used when creating or updating activities).",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/sales/activities/statuses", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
