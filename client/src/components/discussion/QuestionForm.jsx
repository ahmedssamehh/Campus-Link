import React, { useState } from 'react';

const QuestionForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Content must be at least 20 characters';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process tags
    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    onSubmit({
      ...formData,
      tags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Question Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="What's your question? Be specific."
          className={`w-full px-4 py-3 border ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200`}
          disabled={isLoading}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Content Field */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Details *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Provide more details about your question..."
          rows={8}
          className={`w-full px-4 py-3 border ${
            errors.content ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none`}
          disabled={isLoading}
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
        <p className="mt-1 text-xs text-gray-500">
          {formData.content.length} characters (minimum 20)
        </p>
      </div>

      {/* Tags Field */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., programming, math, physics (comma-separated)"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition duration-200"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Posting...
            </>
          ) : (
            'Post Question'
          )}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
