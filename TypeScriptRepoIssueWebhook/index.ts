import { AzureFunction, Context, HttpRequest } from "@azure/functions"
// import * as isValid from "is-valid-github-event"
import { numberOfThings } from "../shared/constants";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');

    // TODO: security check
    // if (!isValid(req, 'my-secret', {event: 'issues', action: 'opened'})) {

        // context.res = {
        //     status: 400,
        //     body: "Please pass a name on the query string or in the request body"
        // };
        // return;
    // }


    context.res = {
        body: "Hello there are " + numberOfThings + "things"
    };
};

export default httpTrigger;
