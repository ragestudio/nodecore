module.exports = {
    pkg: "docs",
    appendCli: [
        {
            command: "gendocs",
            exec: (context, args) => {
                require("./dist/index.js.js").default(args)
            }
        }
    ],
}