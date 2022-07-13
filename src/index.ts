#!/usr/bin/env node
import terminalKit from 'terminal-kit';
import dotenv from 'dotenv';
import readline from 'readline';
import { AxiosError } from 'axios';
import LogServices from './services/LogServices';
import './server';

dotenv.config({ path: `${__dirname}/../.env` });

const term = terminalKit.terminal;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

LogServices.initialText(rl, term)
  .then(async (accessToken) => {
    await LogServices.mainText(rl, term, accessToken);
    process.exit(0);
  })
  .catch((error) => {
    if (error instanceof AxiosError) {
      console.log(error.response?.data);
    } else {
      console.log(error);
    }
    process.exit(1);
  });
