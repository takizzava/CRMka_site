# GickCRM Marketing Site

Продовая статическая версия маркетингового сайта GickCRM.

## Запуск локально

```bash
python3 -m http.server 8080
```

Откройте `http://localhost:8080`.

## Деплой на Cloudflare Pages

- Build command: оставить пустым
- Build output directory: `/`
- Production branch: `main`

## Перед публикацией

1. Проверьте адрес `hello@gickcrm.ru` в `index.html`.
2. Уточните тарифы и юридические ссылки.
3. Добавьте подключение реальной формы или CRM-webhook вместо `mailto`, когда endpoint будет готов.
4. Проверьте домен и canonical URL после подключения `gickcrm.ru`.

Изображения интерфейса оптимизированы в WebP и находятся в `assets/product`.
