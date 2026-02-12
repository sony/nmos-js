#!/bin/bash

nmos_js_dir=$1
shift
testing_facade_dir=$1
shift
testing_dir=$1
shift
results_dir=$1
shift
badges_dir=$1
shift
summary_path=$1
shift
host=$1
shift
build_prefix=$1
shift

cd `dirname $0`
self_dir=`pwd`
cd -

expected_disabled_IS_04_04=1
expected_disabled_IS_05_03=0


# Run nmos-js
cd ${nmos_js_dir}
yarn start > ${testing_dir}/${results_dir}/nmos_js_output 2>&1 &
NMOS_JS_PID=$!

function do_run_test() {
  suite=$1
  shift
  max_disabled_tests=$1
  shift

  # Run Testing Facade
  cd ${testing_facade_dir}
  python TestingFacade.py --suite ${suite} > ${testing_dir}/${results_dir}/testing_facade_output 2>&1 &
  TESTING_FACADE_PID=$!
  # Wait for testing facade to settle
  sleep 10s
  
  cd ${testing_dir}
  output_file=${results_dir}/${build_prefix}${suite}.json
  echo ${output_file}
  result=$(python nmos-test.py suite ${suite} --selection all "$@" --output "${output_file}" >> ${results_dir}/testoutput 2>&1; echo $?)
  if [ ! -e ${output_file} ]; then
    echo "No output produced"
    result=2
  else
    disabled_tests=$(($(grep -c '"Test Disabled"' ${output_file} 2>/dev/null || echo 0) + $(grep -c '"Could Not Test"' ${output_file} 2>/dev/null || echo 0)))
    if [[ $disabled_tests -gt $max_disabled_tests ]]; then
      echo "$disabled_tests tests disabled, expected max $max_disabled_tests"
      result=2
    elif [[ $disabled_tests -gt 0 ]]; then
      echo "$disabled_tests tests disabled"
    fi
  fi
  case $result in
  [0-1])  echo "Pass" | tee ${badges_dir}/${suite}.txt
          echo "${suite} :heavy_check_mark:" >> ${summary_path}
          ;;
  *)      echo "Fail" | tee ${badges_dir}/${suite}.txt
          echo "${suite} :x:" >> ${summary_path}
          ;;
  esac
  
  # Testing Facade should have already terminates, but just in case
  kill $TESTING_FACADE_PID || echo "Testing Facade not running"
}

# Run Testing Facade
# cd ${testing_facade_dir}
# python TestingFacade.py --suite "IS-04-04" > ${testing_dir}/${results_dir}/testing_facade_output 2>&1 &
# TESTING_FACADE_PID=$!
# Wait for testing facade to run
# sleep 10s

# cd ${testing_dir}
do_run_test IS-04-04 $expected_disabled_IS_04_04 --host "${host}" null --port 5001 0 --version v1.0 v1.3

# kill $TESTING_FACADE_PID || echo "Testing Facade not running"

# Run Testing Facade
# cd ${testing_facade_dir}
# python TestingFacade.py --suite "IS-05-03" > ${testing_dir}/${results_dir}/testing_facade_output 2>&1 &
# TESTING_FACADE_PID=$!
# Wait for testing facade to run
# sleep 10s

# cd ${testing_dir}
do_run_test IS-05-03 $expected_disabled_IS_05_03 --host "${host}" null null --port 5001 0 0 --version v1.0 v1.3 v1.1

# kill $TESTING_FACADE_PID || echo "Testing Facade not running"

# Stop nmos-js
kill $NMOS_JS_PID || echo "nmos-js not running"


