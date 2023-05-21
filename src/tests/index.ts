import { checkConflicts } from "../index";

const fileString1 = `
    class Test {
        constructor() {
            console.log("hello world");
        }
    }
`;

const fileString2 = `
    class Test2 {
        constructor() {
            console.log("hello world2");
        }
    }   
`;

checkConflicts(fileString1, fileString2).then(console.log);
