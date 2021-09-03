const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let tasks = [];


io.on('connection', (socket) => {
    console.log('a user connected');
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve('./index.html'));
})

app.get('/tasks', function (req, res) {
   res.send(tasks);
});

app.get('/task/details/:id', function (req, res) {
   let taskInfo;

   let {id} = req.params;

    tasks.some((task) => {
        if(task.id === Number(id)) {
            taskInfo = task;
            return true;
        }
    });

    if(!taskInfo) {
        return res.status(404).send({
            message: 'task not found'
        })
    }

    res.send(taskInfo);

});

app.post('/create/task', async (req, res) => {
    try {

        let {
           title,
           description
        } = req.body;

        if(!title || !description) {
            return res.status(400).send({
                message: 'invalid data'
            })
        }

        let task = {
            title,
            description,
            id: tasks.length + 1,
            status: 0
        };

        tasks.push(task);

        io.emit('task_created', task); // This will emit the event to all connected sockets


        res.send({
            success: true
        })

    } catch (Err) {
        res.status(500).send('internal server Error');
    }
});

app.put('/update/status', async (req, res) => {
    try {
        let {
            id,
            status
        } = req.body;

        if (!id || !status) {
            return res.status(400).send({
                message: 'invalid data'
            })
        }

        let taskInfo, taskIndex;
        tasks.some((task, index) => {
            if(task.id === id) {
                taskInfo = task;
                taskIndex = index;
                return true;
            }
        });

        if(!taskInfo) {
            return res.status(404).send({
                message: 'invalid task id'
            })
        }

        tasks[taskIndex].status = status;

        io.emit('event_status_updated',  tasks[taskIndex]);

        res.send({
            success: true
        });

    } catch (Err) {
        res.status(500).send('internal server Error');
    }
})

server.listen(5001, () => {
    console.log('server listening on port 5001');
})