from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .quality_data import QualityData
from .model import Model
from .prediction import Prediction
from .process_data import ProcessData
from .quality_label import QualityLabel
from .material_batch import MaterialBatch
from .equipment_status import EquipmentStatus
from .environment_data import EnvironmentData