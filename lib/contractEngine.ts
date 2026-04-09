/**
 * contractEngine.ts
 *
 * documentContent 내 {{#if}} ... {{#elif}} ... {{#else}} ... {{/if}} 조건 블록을
 * 현재 values 기준으로 평가해 최종 텍스트를 반환하는 엔진.
 *
 * 지원 연산자:
 *   fieldId == "value"
 *   fieldId != "value"
 */

type Values = Record<string, string>

/** 단일 조건 평가 */
function evalCondition(condition: string, values: Values): boolean {
  const trimmed = condition.trim()

  const eqMatch = trimmed.match(/^(\w+)\s*==\s*"([^"]*)"$/)
  if (eqMatch) {
    return (values[eqMatch[1]] ?? '') === eqMatch[2]
  }

  const neqMatch = trimmed.match(/^(\w+)\s*!=\s*"([^"]*)"$/)
  if (neqMatch) {
    return (values[neqMatch[1]] ?? '') !== neqMatch[2]
  }

  return false
}

type Directive = '#if' | '#elif' | '#else' | '/if'

interface Token {
  type: 'text' | 'tag'
  value: string        // text 내용 or 조건 문자열
  directive?: Directive
  start: number
  end: number
}

/** 콘텐츠를 text / tag 토큰으로 분리 */
function tokenize(content: string): Token[] {
  const tagRegex = /\{\{(#if|#elif|#else|\/if)([^}]*)\}\}/g
  const tokens: Token[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(content)) !== null) {
    // 태그 앞 텍스트
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: content.slice(lastIndex, match.index), start: lastIndex, end: match.index })
    }
    tokens.push({
      type: 'tag',
      directive: match[1].trim() as Directive,
      value: match[2].trim(),
      start: match.index,
      end: match.index + match[0].length,
    })
    lastIndex = match.index + match[0].length
  }

  // 마지막 텍스트
  if (lastIndex < content.length) {
    tokens.push({ type: 'text', value: content.slice(lastIndex), start: lastIndex, end: content.length })
  }

  return tokens
}

interface StackFrame {
  outerActive: boolean
  outerMet: boolean
}

/**
 * documentContent 내 조건 블록을 values 기준으로 처리.
 * {{#if}}, {{#elif}}, {{#else}}, {{/if}} 지원.
 * 중첩 if 지원.
 */
export function processConditionals(content: string, values: Values): string {
  const tokens = tokenize(content)
  const result: string[] = []
  const stack: StackFrame[] = []

  let activeOutput = true   // 현재 텍스트를 출력할지
  let conditionMet = false  // 현재 if 체인에서 이미 true 브랜치를 선택했는지

  for (const token of tokens) {
    if (token.type === 'text') {
      if (activeOutput) result.push(token.value)
      continue
    }

    // tag 처리
    switch (token.directive) {
      case '#if': {
        stack.push({ outerActive: activeOutput, outerMet: conditionMet })
        const met = evalCondition(token.value, values)
        conditionMet = met
        activeOutput = activeOutput && met
        break
      }
      case '#elif': {
        const outer = stack[stack.length - 1]
        if (!outer) break
        if (!outer.outerActive) {
          activeOutput = false
        } else if (conditionMet) {
          activeOutput = false
        } else {
          const met = evalCondition(token.value, values)
          conditionMet = met
          activeOutput = met
        }
        break
      }
      case '#else': {
        const outer = stack[stack.length - 1]
        if (!outer) break
        if (!outer.outerActive) {
          activeOutput = false
        } else {
          activeOutput = !conditionMet
          conditionMet = true
        }
        break
      }
      case '/if': {
        const outer = stack.pop()
        if (outer) {
          activeOutput = outer.outerActive
          conditionMet = outer.outerMet
        }
        break
      }
    }
  }

  // 연속 빈 줄 3개 이상 → 2개로 정리 (조건 제거 후 생기는 공백 처리)
  return result.join('').replace(/\n{3,}/g, '\n\n')
}
