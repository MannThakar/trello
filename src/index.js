const express = require("express");
const app = express();
const config = require("./config/index");
const jwt = require("jsonwebtoken");
const { authenticate } = require("./middleware/Authenticate");
const { connectMongoose } = require("./config/database/index");
const { setServers } = require("node:dns/promises");
const { userModel, organizationModel } = require("./model/index");
setServers(["1.1.1.1", "8.8.8.8"]);

let OID = 1;
let BID = 1;
let TID = 1;

const ORGANIZATIONS = [
  {
    oid: OID++,
    admin: 1,
    name: "7Span",
    members: [],
  },
];
const BOARDS = [
  {
    bid: BID++,
    title: "Bayant",
    uid: 1,
    oid: 1,
  },
];
const TASKS = [
  {
    tid: TID++,
    title: "FE issue",
    description: "Lorem lorem",
    oid: 1,
    uid: 1,
  },
];

app.use(express.json());

app.post("/sign-up", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({
      status: 400,
      data: "All fields are required",
    });
  }

  const hasUser = await userModel.findOne({ email });

  if (hasUser) {
    return res.status(400).send({
      status: 400,
      data: "User already exist please login",
    });
  }

  const newUser = await userModel.create({
    username,
    email,
    password,
  });

  if (!newUser) {
    return res.status(500).send({
      status: 500,
      data: "Something went wrong please try again",
    });
  }

  return res.status(201).send({
    status: 201,
    data: "User successfully sign up",
  });
});

app.post("/sign-in", async (req, res) => {
  const { userIdentifier, password } = req.body;

  if (!userIdentifier || !password) {
    return res.status(400).send({
      status: 400,
      data: "All fields are required",
    });
  }

  const hasUser = await userModel.findOne({
    $or: [{ email: userIdentifier }, { username: userIdentifier }],
    password,
  });

  if (!hasUser) {
    return res.status(400).send({
      status: 400,
      data: "Invalid credential or user doesn't exist",
    });
  }

  const _EXPIRES_IN = config?.EXPIRES_IN ?? "1h";
  const secretKey = hasUser?._id;
  const accessToken = jwt.sign({ uid: secretKey }, config.SALT, {
    expiresIn: _EXPIRES_IN,
  });
  return res.status(200).send({
    status: 200,
    data: accessToken,
  });
});

app.post("/create-organization", authenticate, async (req, res) => {
  const { name } = req.body ?? {};
  const { uid } = req.headers;

  if (!name) {
    return res.status(400).send({
      status: 400,
      data: "All fields are required",
    });
  }

  const isOrganizationExist = await organizationModel.findOne({
    name,
  });

  if (isOrganizationExist) {
    return res.status(409).send({
      status: 409,
      data: "Organization already exist",
    });
  }

  const newOrganization = await organizationModel.create({
    name,
    admin: uid,
  });

  if (!newOrganization) {
    return res.status(500).send({
      status: 500,
      data: "Something went wrong",
    });
  }

  return res.status(200).send({
    status: 200,
    data: "Organization created successfully",
  });
});

app.post("/create-board", (req, res) => {
  try {
    const { title, description } = req.body ?? {};
    const accessToken = req.headers.authorization?.split(" ")[1] ?? {};

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    if (!title) {
      throw Error("All fields are req");
    }

    const { oid } = ORGANIZATIONS.find((user) => user.admin === uid) ?? {};

    BOARDS.push({
      bid: BID++,
      title,
      description,
      uid,
      oid,
    });

    return res.status(200).send({
      status: 200,
      data: BOARDS,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error,
    });
  }
});

app.post("/create-task", (req, res) => {
  try {
    const { title, description } = req.body ?? {};
    const accessToken = req.headers.authorization?.split(" ")[1] ?? {};

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    if (!title) {
      throw Error("All fields are req");
    }

    const { oid } = TASKS.find((user) => user.admin === uid) ?? {};

    TASKS.push({
      tid: TID++,
      title,
      description,
      uid,
      oid,
    });

    return res.status(200).send({
      status: 200,
      data: TASKS,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error,
    });
  }
});

app.post("/add-member", authenticate, async (req, res) => {
  const { organizationId, userIdentifier } = req.body;
  const { uid } = req.headers;

  if (!userIdentifier || !organizationId) {
    return res.status(400).send({
      status: 400,
      data: "All fields are required",
    });
  }

  const hasOrganization = await organizationModel.findOne({
    _id: organizationId,
  });

  if (!hasOrganization || hasOrganization?.admin.toString() !== uid) {
    return res.status(400).send({
      status: 400,
      data: "Invalid organization or access denied",
    });
  }

  const invitedUser = await userModel.findOne({
    $or: [{ email: userIdentifier }, { username: userIdentifier }],
  });

  if (!invitedUser) {
    return res.status(400).send({
      status: 400,
      data: "Invalid user or user doesn't exist",
    });
  }

  if (hasOrganization?.members?.includes(invitedUser._id)) {
    return res.status(409).json({
      success: false,
      message: "User already a member",
    });
  }

  const newMember = await organizationModel.findOneAndUpdate(
    { _id: organizationId },
    { $push: { members: invitedUser._id } },
  );

  if (!newMember) {
    return res.status(500).send({
      status: 500,
      data: "Something went wrong please try again",
    });
  }

  return res.status(200).send({
    status: 200,
    data: "User added successfully",
  });
});

app.get("/organizations", authenticate, async (req, res) => {
  const { uid } = req.headers;
  const { organizationId } = req.params;

  const isAdmin = await organizationModel.findOne({
    admin: uid,
  });

  if (!isAdmin || isAdmin?.admin?.toString() !== uid) {
    return res.status(403).send({
      status: 403,
      data: "User doesn't exist or you don't have permission",
    });
  }

  const users = await userModel.find();

  return res.status(200).send({
    status: 200,
    data: {
      id: isAdmin._id,
      title: isAdmin.name,
      members: isAdmin?.members?.map((membersId) => {
        return users.find(
          (user) => user._id.toString() === membersId.toString(),
        );
      }),
    },
  });
});

app.get("/boards", (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? {};

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    return res.status(200).send({
      status: 200,
      data: BOARDS,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error.message,
    });
  }
});

app.get("/tasks", (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? "";

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    return res.status(200).send({
      status: 200,
      data: TASKS,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error.message,
    });
  }
});

app.get("/boards/:boardId", (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? "";
    const { boardId } = req.params ?? "";

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    const boards =
      BOARDS.find((board) => board.bid === Number(boardId)) ?? "No data found";

    return res.status(200).send({
      status: 200,
      data: boards,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error.message,
    });
  }
});

app.get("/tasks/:taskId", (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? {};
    const { taskId } = req.params ?? "";

    if (!accessToken) {
      throw Error("Token is expire or missing");
    }

    const { uid } = jwt.verify(accessToken, config.SALT);

    if (uid === null || uid === undefined) {
      throw Error("Invalid Token");
    }

    const tasks =
      TASKS.find((task) => task.tid === Number(taskId)) ?? "No data found";

    return res.status(200).send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      data: error.message,
    });
  }
});

app.listen(config?.PORT, () => {
  console.log("Server is running on", config?.PORT);
  connectMongoose();
});
