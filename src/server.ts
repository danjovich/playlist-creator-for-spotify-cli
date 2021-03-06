import express, { Request, Response } from 'express';
import path from 'path';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '/pages/index.html'));
});

app.listen(8080);
