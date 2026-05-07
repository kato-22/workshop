from pathlib import Path

from flask import Flask, jsonify, render_template, request

from infrastructure.clock import SystemClock
from infrastructure.repositories.session_repository import SessionRepository
from infrastructure.repositories.sqlite_session_repository import SQLiteSessionRepository
from services.session_service import ValidationError, record_completed_session
from services.settings_service import get_timer_settings
from services.stats_service import get_today_stats


def create_app(
	repository: SessionRepository | None = None,
	clock: SystemClock | None = None,
) -> Flask:
	app = Flask(__name__)
	app.config["SESSION_REPOSITORY"] = repository or SQLiteSessionRepository(
		Path(__file__).with_name("data") / "pomodoro.db"
	)
	app.config["CLOCK"] = clock or SystemClock()
	app.config["SESSION_REPOSITORY"].initialize()

	@app.get("/")
	def index() -> str:
		return render_template("index.html")

	@app.get("/api/settings")
	def settings():
		return jsonify(get_timer_settings())

	@app.get("/api/stats/today")
	def today_stats():
		return jsonify(
			get_today_stats(
				app.config["SESSION_REPOSITORY"],
				app.config["CLOCK"].now(),
			)
		)

	@app.post("/api/sessions")
	def create_session():
		payload = request.get_json(silent=True)
		result = record_completed_session(payload, app.config["SESSION_REPOSITORY"])
		return jsonify(result), 201

	@app.errorhandler(ValidationError)
	def handle_validation_error(error: ValidationError):
		return jsonify({"error": str(error)}), 400

	return app


app = create_app()


if __name__ == "__main__":
	app.run(debug=True)
