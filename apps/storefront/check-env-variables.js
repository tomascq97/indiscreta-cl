const c = require("ansi-colors")
const {
  EnvironmentValidationError,
  validateStorefrontEnvironment,
} = require("./src/lib/env-config")

function checkEnvVariables(environment = process.env) {
  try {
    return validateStorefrontEnvironment(environment)
  } catch (error) {
    if (!(error instanceof EnvironmentValidationError)) {
      throw error
    }

    console.error(c.red.bold("\nError: Invalid environment configuration\n"))
    error.issues.forEach((issue) => console.error(c.yellow(`  ${issue}`)))
    console.error(
      c.yellow("\nReview the named environment variables and try again.\n"),
    )

    process.exit(1)
  }
}

module.exports = checkEnvVariables
