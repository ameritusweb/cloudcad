import numpy as np
from .model_manager import ModelManager

class StructuralAnalysis:
    def __init__(self, model_id):
        self.model_manager = ModelManager.get_instance()
        self.model = self.model_manager.get_model(model_id)

    # ... (previous methods remain the same)

    def generate_recommendations(self, failure_point, material_properties):
        recommendations = []
        
        # Recommendation based on safety factor
        if failure_point['safety_factor'] < 1:
            recommendations.append("Critical: Immediate redesign required. The part is likely to fail under the given load.")
        elif failure_point['safety_factor'] < 1.5:
            recommendations.append("Increase the thickness or change the geometry of this area to improve the safety factor.")
        
        # Recommendation based on stress concentration
        if failure_point['stress'] > 0.8 * material_properties['yield_strength']:
            recommendations.append("Consider adding fillets or chamfers to reduce stress concentration in this area.")
        
        # Recommendation based on material
        if failure_point['stress'] > 0.5 * material_properties['yield_strength']:
            recommendations.append("Consider using a stronger material with a higher yield strength in this area.")
        
        # Recommendation for load redistribution
        recommendations.append("Analyze the load path and consider redistributing the load to reduce stress in this area.")
        
        return recommendations

    def identify_failure_points(self, results, material_properties):
        failure_points = []
        for node, data in results.items():
            safety_factor = material_properties['yield_strength'] / data['stress']
            if safety_factor < 2:  # Consider points with safety factor < 2 as potential failure points
                severity = 1 - (safety_factor / 2)  # Normalize severity between 0 and 1
                failure_point = {
                    'node': node,
                    'position': data['position'],
                    'stress': data['stress'],
                    'safety_factor': safety_factor,
                    'severity': severity
                }
                failure_point['recommendations'] = self.generate_recommendations(failure_point, material_properties)
                failure_points.append(failure_point)

        # Sort failure points by severity (highest to lowest)
        failure_points.sort(key=lambda x: x['severity'], reverse=True)
        return failure_points[:5]  # Return top 5 most severe points

    def perform_analysis(self, material_properties, loads, constraints):
        self.prepare_inp_file(material_properties, loads, constraints)
        self.run_analysis()
        results = self.process_results()
        failure_points = self.identify_failure_points(results, material_properties)
        return results, failure_points