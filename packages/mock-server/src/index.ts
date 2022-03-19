import express from 'express';

const app = express();


app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/stream", async (req, res)=>{
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();
    res.write('retry: 10000\n\n');
    let count = 0;

    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Emit', ++count);
        // Emit an SSE that contains the current 'count' as a string
        res.write(`data: ${count}\n\n`);
    }
})


app.listen(3000, () => {
    console.log("Example app listening on port 3000!");
});

export default app;
