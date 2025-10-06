#!/bin/bash
output_dir=$1
shift
artifacts_dir=$1
shift

cd $output_dir

for file in ${artifacts_dir}/badges/*.txt; do
  suite=`basename $file`
  suite="${suite%.*}"
  pass=true
  if ! grep "Pass" ${artifacts_dir}/badges/${suite}.txt > /dev/null; then
    pass=false
	break
  fi
  echo "$suite passed: $pass"
  if $pass; then
    curl -o ${suite}.svg https://img.shields.io/static/v1?label=${suite}\&message=Pass\&color=brightgreen || ( echo "error downloading badge"; exit 1 )
  else
    curl -o ${suite}.svg https://img.shields.io/static/v1?label=${suite}\&message=Fail\&color=red || ( echo "error downloading badge"; exit 1 )
  fi
done
