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