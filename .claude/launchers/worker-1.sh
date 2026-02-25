#!/usr/bin/env bash
clear
printf '\n\033[1;44m\033[1;37m  ████  I AM WORKER-1  ████  \033[0m\n\n'
cd '/Users/alexhachem/Desktop/KalshiAlpha/.worktrees/wt-1'
exec claude --model opus --dangerously-skip-permissions '/worker-loop'
