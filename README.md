pchain
---------

Orchestrate promise chains.

## series

```javascript
var chain = pchain.series(call1, call2);
chain('some arg').then(success).catch(fail);
```

The code assumes that ```call1``` and ```call2``` are functions
that return a promise. ```pchain.series``` will return a function
that, when called, returns a promise.

```call1``` will be passed the arguments from the chain call,
in this case ```'some arg'```. When the ```call1``` promise
resolves, the result will be passed as arguments into ```call2```.

When ```call2``` resolves, the result will be passed as arguments
into the ```success``` function.

When any call rejects, then execution chain will stop and the
```fail``` function will recieve the error.

## parallel

```javascript
var chain = pchain.parallel(call1, call2);
chain('some arg').then(success).catch(fail);
```

The code assumes that ```call1``` and ```call2``` are functions
that return a promise. ```pchain.parallel``` will return a function
that, when called, returns a promise.

```call1``` and ```call2`` will be passed the arguments from the
chain call,`in this case ```'some arg'```. When the ```call1``` and
```call2``` promises are resolved, the result will be passed as
an array into ```success```.

If ```call1``` or ```call2``` rejects, the ```fail``` function will
recieve the first error.

## combinations

### verbose

```javascript
var chain = pchain.series(call1, pchain.parallel(call2, call3), call4);
chain('foo').then(success).catch(fail);
```

```call1``` is called with ```'foo'```, ```call2``` and ```call3```
are then called with the result from ```call1```, ```call4``` is
called with an array of the results from ```call2``` and ```call3```
and, finally, ```success``` is called with the result of ```call4```.

### simplified

The call above can be written simpler using arrays of functions:

```javascript
var chain = pchain.series(call1, [call2, call3], call4);
chain('foo').then(success).catch(fail);
```

...or even simpler:

```javascript
var chain = pchain(call1, [call2, call3], call4);
chain('foo').then(success).catch(fail);
```

## Licence

The MIT License (MIT)

Copyright (c) 2015 Johan Öbrink

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.