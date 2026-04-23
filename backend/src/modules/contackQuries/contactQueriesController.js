import ContactQueries from "./contactQueries.js";
import { StatusCodes } from "http-status-codes";
import { getPaginationParams, getPaginationInfo } from "../../utils/pagination.js";


// create contact query
export const createContactQuery = async (req, res) => {
  try {
    const contact = await ContactQueries.create(req.body);
    res.status(StatusCodes.CREATED).json({
      contact,
      status: "success",
      message: "Success! Contact query created successfully",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: "error",
      message: error.message,
    });
  }
};

// get all contact queries
export const getAllContactQueries = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      status,
      sortBy = "newest", 
    } = req.query;

    const queryObject = {};

    // Search filtering
    if (search) {
      queryObject.$or = [
        { name: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      queryObject.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        queryObject.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        queryObject.createdAt.$lte = end;
      }
    }

    // Status filter
    if (status) {
      queryObject.status = status;
    }

    // Pagination util
    const { page, limit, skip } = getPaginationParams(req);

    // Sorting options
    let sortObject = {};
    switch (sortBy) {
      case "newest":
        sortObject = { createdAt: -1 };
        break;
      case "oldest":
        sortObject = { createdAt: 1 };
        break;
      case "name":
        sortObject = { name: 1 };
        break;
      case "name-desc":
        sortObject = { name: -1 };
        break;
      default:
        sortObject = { createdAt: -1 };
    }

    // Parallel queries for contacts and total count
    const [contacts, totalDocs] = await Promise.all([
      ContactQueries.find(queryObject)
        .limit(limit)
        .skip(skip)
        .sort(sortObject)
        .lean(),
        
      ContactQueries.countDocuments(queryObject),
    ]);

    // Pagination info util
    const pagination = getPaginationInfo(totalDocs, page, limit);

    res.status(StatusCodes.OK).json({
      status: "success",
      contacts,
      ...pagination,
      filters: {
        search,
        startDate,
        endDate,
        status,
        sortBy,
      },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message,
    });
  }
};

// update contact query
export const updateContactQuery = async (req, res) => {
  try {
    const contact = await ContactQueries.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!contact) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Contact not found" });
    }
    res.status(StatusCodes.OK).json({
      success: true,
      contact,
      message: "Contact updated successfully"
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

// delete contact query
export const deleteContactQuery = async (req, res) => {
  try {
    const contact = await ContactQueries.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Contact not found" });
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
};

