// The task collection
Tasks = new Mongo.Collection("tasks");

AllDoneTasks = Tasks.find(
  {
    standing: { $in: ["closed", "dismissed"]},
    type: "todo"
  },
  {
      sort: { deletedAt: -1 },
      limit: 40
  });
