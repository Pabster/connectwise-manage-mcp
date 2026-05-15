import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CwManageClient } from "../api-client.js";

/**
 * Schedule tools — wraps ConnectWise Manage's `/schedule` endpoints.
 *
 * Schedule entries represent dispatch/calendar appointments (who is going
 * where, when). They differ from sales `activities` and from time entries.
 *
 * Common conditions when searching:
 *   - member/identifier = 'jsmith'
 *   - dateStart >= [2026-05-12T00:00:00Z] and dateStart <= [2026-05-12T23:59:59Z]
 *   - doneFlag = false
 *   - type/id = 4   (ServiceTicket)
 */
export function registerScheduleTools(server: McpServer, client: CwManageClient) {
  // ---------------------------------------------------------------------------
  // Schedule entries
  // ---------------------------------------------------------------------------

  server.tool(
    "cw_search_schedule_entries",
    "Search schedule (dispatch/calendar) entries in ConnectWise Manage. Use 'conditions' for CW query syntax (e.g. \"member/identifier = 'jsmith' and dateStart >= [2026-05-12T00:00:00Z]\").",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
      orderBy: z.string().optional().describe("Field to order by (e.g. 'dateStart asc')"),
    },
    async ({ conditions, page, pageSize, orderBy }) => {
      const result = await client.get("/schedule/entries", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
        orderBy,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_get_schedule_entry",
    "Get a specific schedule entry by ID.",
    {
      id: z.number().describe("Schedule entry ID"),
    },
    async ({ id }) => {
      const result = await client.get(`/schedule/entries/${id}`);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_create_schedule_entry",
    "Create a new schedule entry (calendar/dispatch appointment).",
    {
      memberId: z.number().describe("Member (technician) ID to schedule"),
      typeId: z.number().describe("Schedule type ID (use cw_list_schedule_types to discover)"),
      dateStart: z.string().describe("Start date/time (ISO 8601)"),
      dateEnd: z.string().describe("End date/time (ISO 8601)"),
      name: z.string().optional().describe("Display name/subject"),
      objectId: z.number().optional().describe("Linked record ID (e.g. ticket ID when typeId is ServiceTicket)"),
      hours: z.number().optional().describe("Scheduled hours"),
      statusId: z.number().optional().describe("Schedule status ID"),
      where: z.string().optional().describe("Location/site reference"),
      reminder: z.number().optional().describe("Reminder in minutes before start"),
    },
    async ({ memberId, typeId, dateStart, dateEnd, name, objectId, hours, statusId, where, reminder }) => {
      const body: Record<string, unknown> = {
        member: { id: memberId },
        type: { id: typeId },
        dateStart,
        dateEnd,
      };
      if (name !== undefined) body.name = name;
      if (objectId !== undefined) body.objectId = objectId;
      if (hours !== undefined) body.hours = hours;
      if (statusId !== undefined) body.status = { id: statusId };
      if (where !== undefined) body.where = { name: where };
      if (reminder !== undefined) body.reminder = { id: reminder };

      const result = await client.post("/schedule/entries", body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_update_schedule_entry",
    "Update an existing schedule entry using JSON Patch operations (e.g. reschedule, change status, update linked ticket).",
    {
      id: z.number().describe("Schedule entry ID"),
      operations: z.array(z.object({
        op: z.enum(["replace", "add", "remove"]).describe("Patch operation"),
        path: z.string().describe("JSON path (e.g. 'dateStart', 'dateEnd', 'status/id', 'member/id')"),
        value: z.unknown().optional().describe("New value"),
      })).describe("Array of JSON Patch operations"),
    },
    async ({ id, operations }) => {
      const result = await client.patch(`/schedule/entries/${id}`, operations);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_delete_schedule_entry",
    "Delete a schedule entry (cancel a dispatch/calendar appointment).",
    {
      id: z.number().describe("Schedule entry ID"),
    },
    async ({ id }) => {
      await client.delete(`/schedule/entries/${id}`);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, deletedId: id }, null, 2) }] };
    },
  );

  // ---------------------------------------------------------------------------
  // Schedule reference data
  // ---------------------------------------------------------------------------

  server.tool(
    "cw_list_schedule_types",
    "List schedule entry types (e.g. ServiceTicket, ProjectTicket, Activity, Reminder).",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/schedule/types", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_list_schedule_statuses",
    "List schedule entry statuses (e.g. Tentative, Confirmed, Done).",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/schedule/statuses", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_list_schedule_calendars",
    "List schedule calendars (work-hour definitions).",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/schedule/calendars", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "cw_list_schedule_holidays",
    "List company holidays from the schedule module.",
    {
      conditions: z.string().optional().describe("ConnectWise conditions query string"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Results per page (default: 25, max: 1000)"),
    },
    async ({ conditions, page, pageSize }) => {
      const result = await client.get("/schedule/holidays", {
        conditions,
        page: page ?? 1,
        pageSize: pageSize ?? 25,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
