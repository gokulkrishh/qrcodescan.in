git add -f dist
git commit -am "Deployed website"
git filter-branch -f --prune-empty --subdirectory-filter dist
git push -f origin gh-pages
git checkout -
