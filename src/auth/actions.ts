"use server";

import { getUser } from "./server";

export async function getUserAction() {
  try {
    const user = await getUser();
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}