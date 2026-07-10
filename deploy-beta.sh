SERVER=$1

rsync -avz --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='.github' \
  --exclude='.gitignore' \
  --exclude='CNAME' \
  --exclude='LICENSE.txt' \
  -e "ssh" \
  ./ ${SERVER}:/opt/beta/frkn.org/