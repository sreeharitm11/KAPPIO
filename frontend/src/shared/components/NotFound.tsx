import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-9xl font-extrabold text-indigo-600 drop-shadow-sm">
            404
          </h2>
          <p className="mt-4 text-center text-2xl font-semibold text-gray-900">
            Page not found
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
