import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h2 className="mt-6 text-center text-9xl font-extrabold text-indigo-600 drop-shadow-sm">
                404
              </h2>
              <p className="mt-4 text-center text-2xl font-semibold text-gray-900">
                Unexpected Application Error!
              </p>
              <p className="mt-2 text-center text-lg text-gray-600">
                The page you are looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                to="/"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-md font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md hover:shadow-lg"
              >
                Go back home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-6xl font-bold text-red-500 mb-4">{error.status}</h2>
          <p className="text-2xl font-semibold text-gray-800 mb-2">{error.statusText}</p>
          {error.data?.message && <p className="mt-2 text-gray-600">{error.data.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-4xl font-bold text-red-600 mb-4">Oops!</h2>
        <p className="text-xl text-gray-700">An unexpected error occurred.</p>
        <p className="mt-2 text-sm text-gray-500">{(error as Error)?.message}</p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
