# redom-state
[RE:DOM](https://redom.js.org) state handling example

## Demo
https://pakastin.github.io/redom-state/

## How it works?
The whole state handling code is 447 bytes:
https://github.com/pakastin/redom-state/blob/master/js/utils/dispatch.js

It uses native HTML events to dispatch actions upstream and RE:DOM component updates to update views downstream. That's it :)

## Benefits
- Fast
- Small
- Asynchronous, but immediate
- Flexible (stopPropagation etc)

## Run
```
npm start
```

Then navigate to [http://localhost:8080/](http://localhost:8080/)

## Dev mode
```
npm run dev
```
