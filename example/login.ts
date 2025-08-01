import { Context, Hono } from "hono";

const loginRoutes = new Hono()

loginRoutes.get("/", (c) => {
   return c.json({ message: "Login page" })
})

loginRoutes.get("/change-password/:id", (c) => {
    return c.json({ message: "Change password page", id: c.req.param('id') })
 })
 

export {loginRoutes}