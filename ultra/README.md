#### Strictly sequential 
First s3 upload, then lambda invocation

```
sync: 1670.125ms
invoke: 836.591ms
sync: 759.025ms // for comparison

real	0m3,493s
user	0m0,347s
sys	0m0,038s
```



### Js runner



#### some light files

S3 and Lambda on same region (us-east-2)

**128 MB RAM**

:OO

```
js-runner  list objs: 831.614ms
js-runner  dir creation: 40.823ms
js-runner  get objs: 759.627ms

js-runner  list objs: 82.075ms
js-runner  dir creation: 20.243ms
js-runner  get objs: 541.033ms

js-runner  list objs: 142.819ms
js-runner  dir creation: 17.303ms
js-runner  get objs: 620.968ms
```


**512 MB RAM**
Pog (nicht inkludiert: s3 import)
```
js-runner  list objs: 72.340ms
js-runner  dir creation: 0.866ms
js-runner  get objs: 127.716ms

js-runner  list objs: 108.382ms
js-runner  dir creation: 0.708ms
js-runner  get objs: 128.035ms

js-runner  list objs: 103.787ms
js-runner  dir creation: 0.503ms
js-runner  get objs: 126.105ms
```


#### some light files + 10MB file

**512 MB RAM**


