# キャチロボapp
## 起動法
``` docker compose up -d --build```
各コンテナに入りたいときは
```docker exec -it <コンテナ名> sh```
## その他
bindマウントにしてるからホットリロードされるはず