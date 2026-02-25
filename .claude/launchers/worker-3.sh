#!/usr/bin/env bash
clear
printf '\n\033[1;44m\033[1;37m  ████  I AM WORKER-3  ████  \033[0m\n\n'
cd '/Users/alexhachem/Desktop/KalshiAlpha/.worktrees/wt-3'
exec claude --model opus --dangerously-skip-permissions '/worker-loop'
