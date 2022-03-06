yarn site
cd docs/.vuepress/dist
git init
git add -A
git commit -m 'docs($site): deploy site'
git push -f git@github.com:fe6/shared.git master:gh-pages
