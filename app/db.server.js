import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient().$extends(withAccelerate());
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient().$extends(withAccelerate());

export default prisma;
