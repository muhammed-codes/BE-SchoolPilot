import { GradingSystem } from '../../common/enums';
import { ScoreComponentConfigInput } from './score-component-config.type';
export declare class CreateResultSheetInput {
    classId: string;
    termId: string;
    gradingSystem: GradingSystem;
    scoreComponents: ScoreComponentConfigInput[];
}
