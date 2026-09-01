import type Elysia from "elysia";
import { BackblazeStorageAdapter } from "../adapters/storage/backblaze.storage";

const storageAdapter = new BackblazeStorageAdapter()

export const storagePlugin = (app: Elysia) => app.decorate('storageProvider', storageAdapter);