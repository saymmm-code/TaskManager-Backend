// Import Task and User models
const Task = require("../models/Task");
const User = require("../models/User");

// Import exceljs library
const excelJS = require("exceljs");

/**
 * ================================
 * EXPORT TASKS REPORT (Excel) - Admin Only
 * ================================
 */
const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
      { header: "Progress", key: "progress", width: 15 },
      { header: "Completed Todos", key: "completedTodos", width: 20 },
      { header: "Total Todos", key: "totalTodos", width: 15 },
    ];

    tasks.forEach((task) => {
      const assignedTo =
        task.assignedTo && task.assignedTo.length
          ? task.assignedTo
              .map((u) => `${u.name} (${u.email})`)
              .join(", ")
          : "Unassigned";

      const completedTodos = task.todoCheckList.filter(t => t.completed).length;
      const totalTodos = task.todoCheckList.length;

      worksheet.addRow({
        _id: task._id.toString(),
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate
          ? task.dueDate.toISOString().split("T")[0]
          : "",
        assignedTo,
        progress: `${task.progress}%`,
        completedTodos,
        totalTodos,
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tasks_report.xlsx"'
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Export tasks error:", error);
    res.status(500).json({ message: "Error exporting tasks" });
  }
};

/**
 * ================================
 * EXPORT USERS TASK SUMMARY REPORT
 * For Admin: All users
 * For Member: Only their own tasks
 * ================================
 */
const exportUsersReport = async (req, res) => {
  try {
    const currentUser = req.user;
    let users;
    let tasks;

    if (currentUser.role === 'admin') {
      // Admin gets all users and tasks
      users = await User.find().select("name email _id").lean();
      tasks = await Task.find().populate("assignedTo", "_id");
    } else {
      // Member gets only their own data
      users = [{ 
        name: currentUser.name, 
        email: currentUser.email, 
        _id: currentUser._id 
      }];
      tasks = await Task.find({ assignedTo: currentUser._id }).populate("assignedTo", "_id");
    }

    const userTaskMap = {};

    users.forEach((user) => {
      userTaskMap[user._id.toString()] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    tasks.forEach((task) => {
      if (!Array.isArray(task.assignedTo)) return;

      task.assignedTo.forEach((u) => {
        const id = u._id.toString();
        if (!userTaskMap[id]) return;

        userTaskMap[id].taskCount++;

        if (task.status === "Pending")
          userTaskMap[id].pendingTasks++;
        else if (task.status === "In Progress")
          userTaskMap[id].inProgressTasks++;
        else if (task.status === "Completed")
          userTaskMap[id].completedTasks++;
      });
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      currentUser.role === 'admin' ? "Team Task Report" : "My Task Report"
    );

    worksheet.columns = [
      { header: "User Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Total Assigned Tasks", key: "taskCount", width: 22 },
      { header: "Pending Tasks", key: "pendingTasks", width: 20 },
      { header: "In Progress Tasks", key: "inProgressTasks", width: 22 },
      { header: "Completed Tasks", key: "completedTasks", width: 22 },
    ];

    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user);
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const filename = currentUser.role === 'admin' 
      ? 'team_tasks_report.xlsx' 
      : 'my_tasks_report.xlsx';

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({ message: "Error exporting users report" });
  }
};

module.exports = {
  exportTasksReport,
  exportUsersReport,
};