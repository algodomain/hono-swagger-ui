import { Context, Hono } from "hono";

const rolesRouter = new Hono()

rolesRouter.get("/", (c) => {
   return c.json({ message: "List all roles" })
})

rolesRouter.get("/:id", (c) => {
    const id = c.req.param('id')
    return c.json({ message: "Get role by ID", id })
 })

rolesRouter.post("/", (c) => {
    return c.json({ message: "Create new role" })
 })

rolesRouter.put("/:id", (c) => {
    const id = c.req.param('id')
    return c.json({ message: "Update role", id })
 })

rolesRouter.delete("/:id", (c) => {
    const id = c.req.param('id')
    return c.json({ message: "Delete role", id })
 })

export default rolesRouter 