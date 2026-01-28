import type { Schema } from "../../data/resource"

export const handler: Schema["sayHello"]["functionHandler"] = async (event) => {
  const token = event.arguments.token
  console.log("sayHello function invoked with token:", token);
  return token + "!test";
}