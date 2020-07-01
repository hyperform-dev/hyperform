### Plain js invoke script (SDK) (baseline)

us-east-2
128 MB RAM
Trivial fn

##### n = 100

```
// pretty representative

require aws: 280.918ms
new lambda obj: 5.784ms
n: 100
kicked off 0
kicked off 1
kicked off 2
...
kicked off 97
kicked off 98
kicked off 99
kick-off all: 116.521ms
invo-2: 865.096ms
invo-0: 894.167ms
invo-3: 868.389ms
...
invo-48: 2503.083ms
invo-46: 2553.820ms
invo-47: 2560.784ms
invo-99: 2587.815ms
invo-49: 2688.441ms
compl all: 2651.756ms
```


##### n = 1000


**With logging**

```

require aws: 150.623ms
new lambda obj: 4.390ms
n: 1000
kicked off 0
kicked off 1
kicked off 2
...
kicked off 997
kicked off 998
kicked off 999
kick-off all: 678.873ms
invo-6: 1512.794ms
invo-1: 1520.165ms
...
invo-996: 10428.056ms
invo-997: 11053.436ms
invo-999: 11053.231ms
invo-962: 11076.191ms
compl all: 11053.578ms

```

**Without logging**

##### n = 1000

```
require aws: 150.729ms
new lambda obj: 4.812ms
n: 1000
kick-off all: 515.534ms
compl all: 10479.286ms
```

##### n = 2000

```
require aws: 145.504ms
new lambda obj: 4.551ms
n: 2000
kick-off all: 875.825ms
compl all: 22242.991ms
```


## Bundling

(Without recruiter, production)

19. Nov: `233K Nov 19 14:23 bundle.js`