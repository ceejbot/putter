#!/bin/bash

echo "Making sure you have all putter development & ops tools installed."

function doBrew {
	PKG=$1
	CMD=$2
	if hash $CMD 2>/dev/null; then
		echo "  $PKG present"
	else
		brew install $PKG
	fi
}
if [[ ! hash brew 2>/dev/null ]]; then
	/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi

doBrew ansible ansible
doBrew redis redis-cli
doBrew postgres psql
doBrew nsq nsqd
doBrew nvm nvm

nvm install v6.10.2
