WORKFLOW_NAME="$1"
response=$(cat response.txt)

pipelineId=$(jq -r '.id' <<< "$response")

workflowUrl=""
while [[ "workflowUrl" == "" ]]; do
  sleep 5

    workflowResponse=$(curl --request GET \
        --url https://circleci.com/api/v2/pipeline/$pipelineId/workflow \
        --header "Circle-Token: $CCI_TOKEN" \
        --header 'content-type: application/json')

    for ((i=0;; i++)); do
        itemIndex=".items[$i]"
        item=$(jq $itemIndex <<< "$workflowResponse")

        if ! [[ "$item" == "null" ]]; then
            name=$(jq -r '.name' <<< "$item")
            workflowId=$(jq -r '.id' <<< "$item")

            if [[ "$name" == "$WORKFLOW_NAME" ]]; then
                workflowUrl="https://app.circleci.com/pipelines/api/v2/workflow/$workflowId"
                break
            fi
        else
            break
        fi
    done
done

echo $workflowUrl >> workflow_url.txt
