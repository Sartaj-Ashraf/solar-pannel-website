import { Router } from "express";
const router = Router();

import {
    createContactQuery,
    getAllContactQueries,
    deleteContactQuery,
    updateContactQuery,
} from "./contactQueriesController.js";



// Create- @params: name, phoneNumber, message - Create new contact form entry
router.post("/", createContactQuery);

// ---##### Auth middleware, controll who can access the below routes #####---
// router.use(authenticateUser);
// router.use(authorizePermissions("admin"));

// Read- @params: search, startDate, endDate, sortBy - Get all contacts
router.get("/", getAllContactQueries);

// Delete- @params: id - Delete by id 
router.delete("/:id", deleteContactQuery);

// Update- @params: id, name, phoneNumber, message, status - Update by id
router.patch("/:id", updateContactQuery);


export default router;
