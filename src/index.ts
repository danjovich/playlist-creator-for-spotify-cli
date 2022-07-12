#!/usr/bin/env node
import terminalKit from 'terminal-kit';
import dotenv from 'dotenv';
import readline from 'readline';
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
  .catch(() => {
    console.log('Something went wrong...');
    process.exit(1);
  });
